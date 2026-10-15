package org.margin.server.cli;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

/**
 * Admin commands for the operator, run inside the server container:
 * {@code docker compose exec margin-server margin reset-password someone@example.com}.
 * Talks to the running server over localhost using the internal API key.
 */
public final class MarginCli {

    private MarginCli() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            usage();
            System.exit(2);
        }
        String apiKey = System.getenv("INTERNAL_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("INTERNAL_API_KEY is not set in this container.");
            System.exit(1);
        }
        String base = "http://127.0.0.1:" + System.getenv().getOrDefault("SERVER_PORT", "8080") + "/api/internal";

        HttpRequest request = switch (args[0]) {
            case "reset-password" -> {
                if (args.length != 2) {
                    usage();
                    System.exit(2);
                }
                String email = URLEncoder.encode(args[1], StandardCharsets.UTF_8);
                yield HttpRequest.newBuilder(URI.create(base + "/reset-link?email=" + email))
                        .header("X-Internal-Api-Key", apiKey)
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .build();
            }
            case "setup-link" -> HttpRequest.newBuilder(URI.create(base + "/setup-link"))
                    .header("X-Internal-Api-Key", apiKey)
                    .GET()
                    .build();
            default -> {
                usage();
                System.exit(2);
                yield null;
            }
        };

        HttpResponse<String> response;
        try {
            response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.io.IOException e) {
            System.err.println("Can't reach the margin server at " + base + " (is it running?).");
            System.exit(1);
            return;
        }
        if (response.statusCode() / 100 == 2) {
            System.out.println(response.body());
            return;
        }
        System.err.println(switch (response.statusCode()) {
            case 404 -> "No account with that email.";
            case 409 -> "The instance already has accounts; there is no setup link.";
            case 403 -> "The server refused the request (is INTERNAL_API_KEY the same as the server's?).";
            default -> "The server answered " + response.statusCode() + ": " + response.body();
        });
        System.exit(1);
    }

    private static void usage() {
        System.err.println("""
                usage: margin <command>
                  reset-password <email>   print a one-time link that lets the account set a new password
                  setup-link               print the first-admin setup link again (only before any account exists)""");
    }
}
