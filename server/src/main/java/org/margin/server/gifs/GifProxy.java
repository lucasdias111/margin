package org.margin.server.gifs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Forwards GIF searches to KLIPY with the operator's API key, so the key never reaches clients.
 * Without KLIPY_API_KEY the feature is off.
 */
@Service
public class GifProxy {

    private static final int PER_PAGE = 24;

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public GifProxy(@Value("${margin.gifs.klipy-api-key:}") String apiKey,
                    @Value("${margin.gifs.klipy-base-url:https://api.klipy.com/api/v1}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public String trending(String page) {
        return fetch("/gifs/trending", page == null ? Map.of() : Map.of("page", page));
    }

    public String search(String query, String page) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "q is required");
        }
        Map<String, String> params = new LinkedHashMap<>();
        params.put("q", query);
        if (page != null) {
            params.put("page", page);
        }
        return fetch("/gifs/search", params);
    }

    private String fetch(String path, Map<String, String> params) {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GIFs are not enabled on this instance");
        }
        Map<String, String> query = new LinkedHashMap<>(params);
        query.put("per_page", String.valueOf(PER_PAGE));
        query.put("format_filter", "gif");
        String encoded = query.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        URI uri = URI.create(baseUrl + "/" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8) + path + "?" + encoded);
        try {
            HttpResponse<String> response = client.send(
                    HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(10)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "GIF search failed");
            }
            return response.body();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "GIF search is unreachable");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
