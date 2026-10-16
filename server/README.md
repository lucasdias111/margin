# margin server

The Spring Boot server of [margin](../README.md): REST API, WebSocket, auth, storage, instance admin and call coordination.

## Building

```bash
./mvnw clean package
```

## Running locally

```bash
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Dev defaults are in `src/main/resources/application-dev.yml`; [CONTRIBUTING.md](../CONTRIBUTING.md#dev-setup) lists the services it expects.

## Tests

```bash
./mvnw test
```

The integration tests use Testcontainers, so Docker must be running.

## License

AGPL-3.0-only, like the rest of the repository. See [LICENSE](../LICENSE).
