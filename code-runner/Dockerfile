FROM eclipse-temurin:21-jdk-jammy AS java-runtime

FROM node:22-bookworm-slim

COPY --from=java-runtime /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server.mjs /app/server.mjs

RUN useradd --create-home --uid 10001 runner
USER runner

EXPOSE 8081
CMD ["java", "-version"]
ENTRYPOINT ["node", "/app/server.mjs"]
