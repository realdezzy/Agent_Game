//! Backend server for the Africa Universe game. The server uses
//! Actix‑web to host an HTTP endpoint which upgrades to a WebSocket
//! connection. Each connected client is represented by a `WsSession`
//! actor. The server maintains a shared state of connected players,
//! their inventories and open challenges. For brevity the
//! implementation focuses on the communication protocol and basic
//! in‑memory state management rather than a fully fledged game
//! engine.

use actix::prelude::*;
use actix_web::{get, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

// Hedera integration would involve signing and submitting transactions
// using a Hedera SDK. For brevity this example does not perform any
// blockchain interactions. See the Hedera Rust SDK for guidance.

/// Information stored about each connected client. For simplicity the
/// client actor address is optional; it's set once the WebSocket
/// upgrade succeeds. Additional fields (username, pvp_level, etc.)
/// are stored here and can be extended as needed.
#[derive(Clone)]
struct ClientInfo {
    username: String,
    pvp_level: u32,
    properties: Vec<Property>,
    addr: Option<Addr<WsSession>>,
}

impl ClientInfo {
    fn new(username: String) -> Self {
        Self {
            username,
            pvp_level: 1,
            properties: Vec::new(),
            addr: None,
        }
    }
}

/// A property owned by a player. Each property has a reward rate
/// associated with it which will be used to compute daily rewards.
#[derive(Clone, Serialize, Deserialize)]
struct Property {
    name: String,
    reward: u32,
}

/// Shared server state holding information about all connected clients.
/// The map keys are unique identifiers for each session. The value
/// contains per‑client data.
#[derive(Clone)]
struct ServerState {
    clients: Arc<RwLock<HashMap<Uuid, ClientInfo>>>,
}

impl ServerState {
    fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

/// The WebSocket session actor. Each connected client is represented by
/// its own instance of `WsSession`. It stores its unique id and a
/// clone of the shared server state. Messages sent and received over
/// the WebSocket are processed within the actor's context.
struct WsSession {
    id: Uuid,
    state: ServerState,
}

impl WsSession {
    fn new(id: Uuid, state: ServerState) -> Self {
        Self { id, state }
    }

    /// Helper to send JSON responses to the connected client. If
    /// serialization fails an error will be logged and nothing sent.
    fn send_json<T: Serialize>(&self, ctx: &mut ws::WebsocketContext<Self>, payload: &T) {
        match serde_json::to_string(payload) {
            Ok(text) => ctx.text(text),
            Err(err) => error!("Failed to serialize response: {}", err),
        }
    }

    /// Handle an incoming JSON message from the client. The protocol is
    /// structured around a `type` field which determines the kind of
    /// request. Additional data is embedded in the message. See the
    /// documentation of each match arm for details.
    async fn handle_client_message(&self, msg: ClientMessage, ctx: &mut ws::WebsocketContext<Self>) {
        match msg {
            ClientMessage::GetProfile => {
                // Respond with the player's own profile. Compute the total
                // reward rate by summing the reward of each property.
                let clients = self.state.clients.read().await;
                if let Some(info) = clients.get(&self.id) {
                    let daily_reward: u32 = info.properties.iter().map(|p| p.reward).sum();
                    let payload = ServerMessage::Profile(ProfilePayload {
                        username: info.username.clone(),
                        pvp_level: info.pvp_level,
                        properties: info.properties.clone(),
                        daily_reward,
                    });
                    self.send_json(ctx, &payload);
                }
            }
            ClientMessage::ListPlayers => {
                // Return a list of other connected players along with their
                // PvP level. Exclude the requesting client.
                let clients = self.state.clients.read().await;
                let players: Vec<PlayerInfo> = clients
                    .iter()
                    .filter(|(k, _)| **k != self.id)
                    .map(|(id, info)| PlayerInfo {
                        id: *id,
                        username: info.username.clone(),
                        pvp_level: info.pvp_level,
                    })
                    .collect();
                let payload = ServerMessage::PlayerList { players };
                self.send_json(ctx, &payload);
            }
            ClientMessage::Purchase { item_id, category } => {
                // In a real implementation we would validate the purchase
                // against a marketplace inventory and the player's balance.
                // Here we simulate granting a new property with a reward
                // based on the category.
                let reward = match category.as_str() {
                    "Islands" => 10,
                    "NFT Characters" => 5,
                    "Buildings" => 2,
                    "Land" => 3,
                    "Weapons" => 1,
                    _ => 1,
                };
                let name = format!("{} Item", category);
                let mut clients = self.state.clients.write().await;
                if let Some(info) = clients.get_mut(&self.id) {
                    info.properties.push(Property { name, reward });
                }
                // Acknowledge the purchase to the client.
                let payload = ServerMessage::PurchaseAck { item_id };
                self.send_json(ctx, &payload);
            }
            ClientMessage::Challenge { target, stake } => {
                // Relay the challenge to the target player if they exist.
                let clients = self.state.clients.read().await;
                if let Some(target_info) = clients.get(&target) {
                    if let Some(addr) = &target_info.addr {
                        // Construct a challenge notification for the target.
                        let challenge = ServerMessage::ChallengeRequest {
                            challenger: self.id,
                            challenger_name: clients
                                .get(&self.id)
                                .map(|c| c.username.clone())
                                .unwrap_or_else(|| "Anonymous".into()),
                            stake,
                        };
                        addr.do_send(challenge);
                        // Inform the challenger that the request was sent.
                        let ack = ServerMessage::ChallengeResponse {
                            message: format!("Challenge sent to {}", target_info.username),
                        };
                        self.send_json(ctx, &ack);
                    }
                }
            }
        }
    }
}

/// Define messages that can be sent from the client to the server.
/// These are deserialized from JSON in the WebSocket handler.
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum ClientMessage {
    #[serde(rename = "getProfile")]
    GetProfile,
    #[serde(rename = "listPlayers")]
    ListPlayers,
    #[serde(rename = "purchase")]
    Purchase { item_id: String, category: String },
    #[serde(rename = "challenge")]
    Challenge { target: Uuid, stake: bool },
}

/// Define the payload sent in a profile response.
#[derive(Debug, Serialize)]
struct ProfilePayload {
    username: String,
    pvp_level: u32,
    properties: Vec<Property>,
    daily_reward: u32,
}

/// Simplified player info returned to other clients when listing
/// available opponents in the PvP arena.
#[derive(Debug, Serialize)]
struct PlayerInfo {
    id: Uuid,
    username: String,
    pvp_level: u32,
}

/// Define messages that the server can send to clients.
#[derive(Debug, Serialize, Message)]
#[rtype(result = "()")]
enum ServerMessage {
    #[serde(rename = "profile")]
    Profile(ProfilePayload),
    #[serde(rename = "playerList")]
    PlayerList { players: Vec<PlayerInfo> },
    #[serde(rename = "purchaseAck")]
    PurchaseAck { item_id: String },
    #[serde(rename = "challengeRequest")]
    ChallengeRequest {
        challenger: Uuid,
        challenger_name: String,
        stake: bool,
    },
    #[serde(rename = "challengeResponse")]
    ChallengeResponse { message: String },
}

impl Handler<ServerMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: ServerMessage, ctx: &mut Self::Context) -> Self::Result {
        // Simply forward the server message to the client over the WebSocket.
        self.send_json(ctx, &msg);
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // When the session starts, register this client's address in the
        // global state so that other clients can message it. Also
        // generate a default username based on the id.
        let id = self.id;
        let addr = ctx.address();
        let state = self.state.clone();
        actix::spawn(async move {
            let mut clients = state.clients.write().await;
            let username = format!("User-{}", &id.to_string()[..8]);
            clients
                .entry(id)
                .and_modify(|info| info.addr = Some(addr.clone()))
                .or_insert_with(|| ClientInfo::new(username)).addr = Some(addr.clone());
        });
        info!("Client {} connected", self.id);
    }

    fn stopping(&mut self, _ctx: &mut Self::Context) -> Running {
        // Remove the client from the state on disconnect.
        let id = self.id;
        let state = self.state.clone();
        actix::spawn(async move {
            let mut clients = state.clients.write().await;
            clients.remove(&id);
        });
        info!("Client {} disconnected", id);
        Running::Stop
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, item: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match item {
            Ok(ws::Message::Text(text)) => {
                // Parse JSON from client into a strongly typed message.
                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(msg) => {
                        let state = self.state.clone();
                        let mut ctx_clone = ctx.clone();
                        // Actix's WebSocketContext isn't Send/Sync so we
                        // handle messages on the Arbiter thread with a
                        // blocking block. This is a simplified pattern.
                        actix::spawn(async move {
                            self.handle_client_message(msg, &mut ctx_clone).await;
                        });
                    }
                    Err(err) => {
                        error!("Invalid message from client {}: {}", self.id, err);
                    }
                }
            }
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Pong(_)) => (),
            Ok(ws::Message::Binary(_)) => (),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}

/// WebSocket endpoint. Upgrades an HTTP request to a WebSocket
/// connection and creates a new session actor. Each new connection
/// receives a unique UUID.
#[get("/ws")]
async fn websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    data: web::Data<ServerState>,
) -> Result<HttpResponse, Error> {
    let id = Uuid::new_v4();
    let session = WsSession::new(id, data.get_ref().clone());
    let resp = ws::start(session, &req, stream);
    resp
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let state = ServerState::new();
    // Start the HTTP server on port 8080. In production you should
    // configure CORS and TLS as appropriate. The server will serve
    // only the WebSocket endpoint; the static front‑end files can be
    // served by a separate web server or CDN.
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .service(websocket_handler)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}