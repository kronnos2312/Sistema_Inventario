package com.inventory.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Notifica a los clientes web conectados (/ws/updates) cuando otro cliente
 * (por ejemplo la app Android) crea/edita/elimina inventario, productos o
 * categorías, para que la interfaz web se refresque sin recarga manual.
 */
@Component
public class UpdateBroadcastHandler extends TextWebSocketHandler {

    public static final String INVENTORY = "INVENTORY";
    public static final String PRODUCT = "PRODUCT";
    public static final String CATEGORY = "CATEGORY";

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    public void broadcast(String entity) {
        TextMessage message = new TextMessage(entity);
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) continue;
            try {
                session.sendMessage(message);
            } catch (IOException ignored) {
                // Sesión rota; se limpiará en afterConnectionClosed.
            }
        }
    }
}
