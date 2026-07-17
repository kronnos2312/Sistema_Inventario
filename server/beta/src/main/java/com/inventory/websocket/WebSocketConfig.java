package com.inventory.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired private UpdateBroadcastHandler updateBroadcastHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // La web se conecta directo (no vía /api-proxy: el rewrite de Next.js no
        // soporta el handshake de upgrade de WebSocket) usando el mismo host y el
        // puerto del backend — igual que la app Android.
        registry.addHandler(updateBroadcastHandler, "/ws/updates").setAllowedOrigins("*");
    }
}
