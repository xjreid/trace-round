package com.traceround.backend.code;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.traceround.backend.code.CodeExecutionClient.CodeExecutionResult;
import com.traceround.backend.code.CodeExecutionClient.TestCase;
import com.traceround.backend.problem.ProblemExecutionSpec;
import com.traceround.backend.problem.ProblemExecutionSpec.Parameter;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

class Judge0CodeExecutionClientTests {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void submitsOncePollsAndMapsHarnessResult() throws Exception {
        AtomicInteger posts = new AtomicInteger();
        AtomicInteger gets = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/submissions", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                posts.incrementAndGet();
                String body = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
                );
                assertTrue(body.contains("\"language_id\":71"));
                assertEquals("secret", exchange.getRequestHeaders().getFirst("X-RapidAPI-Key"));
                respond(exchange, "{\"token\":\"abc\"}");
                return;
            }
            int poll = gets.incrementAndGet();
            if (poll == 1) {
                respond(exchange, "{\"status\":{\"id\":2,\"description\":\"Processing\"}}");
            } else {
                String output = Base64.getEncoder().encodeToString(
                    "__TRACEROUND_RESULT__|1|1|passed\n"
                        .getBytes(StandardCharsets.UTF_8)
                );
                respond(exchange, "{\"stdout\":\"" + output
                    + "\",\"status\":{\"id\":3,\"description\":\"Accepted\"}}");
            }
        });
        server.start();

        Judge0CodeExecutionClient client = client();
        CodeExecutionResult result = client.execute(
            null,
            spec(),
            List.of(new TestCase(1, "[1]", "1")),
            "Python",
            "class Solution:\n    def identity(self, value):\n        return value"
        );

        assertEquals("success", result.status());
        assertEquals(1, posts.get());
        assertEquals(2, gets.get());
    }

    @Test
    void mapsJudge0CompilationErrors() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/submissions", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                respond(exchange, "{\"token\":\"compile\"}");
            } else {
                String output = Base64.getEncoder().encodeToString(
                    "Syntax error".getBytes(StandardCharsets.UTF_8)
                );
                respond(exchange, "{\"compile_output\":\"" + output
                    + "\",\"status\":{\"id\":6,\"description\":\"Compilation Error\"}}");
            }
        });
        server.start();

        CodeExecutionResult result = client().execute(
            null,
            spec(),
            List.of(new TestCase(1, "[1]", "1")),
            "Python",
            "invalid"
        );
        assertEquals("Compilation failed", result.summary());
        assertEquals("Syntax error", result.output());
    }

    private Judge0CodeExecutionClient client() {
        Judge0Properties properties = new Judge0Properties();
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        properties.setApiKey("secret");
        properties.setApiHost("test-host");
        properties.setPollIntervalMillis(1);
        properties.setPollTimeoutSeconds(2);
        return new Judge0CodeExecutionClient(
            RestClient.builder(),
            properties,
            new CodeHarnessFactory(new ObjectMapper())
        );
    }

    private ProblemExecutionSpec spec() {
        return new ProblemExecutionSpec(
            "identity",
            List.of(new Parameter("value", "INTEGER")),
            "INTEGER",
            "RETURN",
            null,
            "INTEGER",
            "EXACT"
        );
    }

    private void respond(HttpExchange exchange, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
