package org.margin.server.unittest;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.margin.server.gifs.GifProxy;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class GifProxyTest {

    private HttpServer klipy;
    private final AtomicReference<String> lastRequest = new AtomicReference<>();

    @BeforeEach
    void startFakeKlipy() throws Exception {
        klipy = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        klipy.createContext("/", exchange -> {
            lastRequest.set(exchange.getRequestURI().toString());
            byte[] body = "{\"result\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        klipy.start();
    }

    @AfterEach
    void stop() {
        klipy.stop(0);
    }

    private GifProxy proxy(String key) {
        return new GifProxy(key, "http://127.0.0.1:" + klipy.getAddress().getPort() + "/api/v1");
    }

    @Test
    void searchesAreForwardedWithTheServersKey() {
        String body = proxy("secret-key").search("happy cat", "2");

        assertEquals("{\"result\":true}", body);
        assertEquals("/api/v1/secret-key/gifs/search?q=happy+cat&page=2&per_page=24&format_filter=gif", lastRequest.get());
    }

    @Test
    void trendingIsForwardedToo() {
        proxy("secret-key").trending(null);

        assertEquals("/api/v1/secret-key/gifs/trending?per_page=24&format_filter=gif", lastRequest.get());
    }

    @Test
    void withoutAKeyTheFeatureIsOff() {
        GifProxy off = proxy("");

        assertFalse(off.isEnabled());
        assertThrows(ResponseStatusException.class, () -> off.search("cat", null));
        assertNull(lastRequest.get(), "nothing reaches KLIPY");
    }
}
