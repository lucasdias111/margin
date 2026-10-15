FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk-noble AS build
WORKDIR /build

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp dependency:go-offline

COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp clean package -DskipTests

RUN cp target/server-*.jar app.jar

FROM eclipse-temurin:25-jre-noble AS runtime
WORKDIR /app

RUN useradd --system --no-create-home --uid 10001 margin \
    && mkdir -p /var/margin/uploads \
    && chown margin /var/margin/uploads
USER margin

COPY --from=build /build/app.jar app.jar
COPY --chmod=755 bin/margin /usr/local/bin/margin

EXPOSE 8080 8081 9090

ENTRYPOINT ["java", "-jar", "app.jar"]