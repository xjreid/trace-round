package com.traceround.backend.code;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

class JdoodleCodeExecutionClientTests {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void sendsOneCombinedRequestAndMapsPassingHarnessResult() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/execute", exchange -> {
            requests.incrementAndGet();
            String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
            );
            assertTrue(body.contains("\"clientId\":\"client\""));
            assertTrue(body.contains("\"clientSecret\":\"secret\""));
            assertTrue(body.contains("\"language\":\"python3\""));
            assertTrue(body.contains("\"versionIndex\":\"5\""));
            assertTrue(body.contains("[1]"));
            assertTrue(body.contains("[2]"));
            assertFalse(body.contains("internetEnabled"));
            respond(exchange, """
                {
                  "output": "__TRACEROUND_RESULT__|2|2|passed\\n",
                  "statusCode": 200,
                  "compilationStatus": null,
                  "isExecutionSuccess": true
                }
                """);
        });
        server.start();

        CodeExecutionResult result = client().execute(
            null,
            spec(),
            List.of(
                new TestCase(1, "[1]", "1"),
                new TestCase(2, "[2]", "2")
            ),
            "Python",
            "class Solution:\n    def identity(self, value):\n        return value"
        );

        assertEquals("success", result.status());
        assertEquals(2, result.passedTests());
        assertEquals(1, requests.get());
    }

    @Test
    void mapsCompilationAndTimeoutResponses() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/execute", exchange -> {
            if (requests.incrementAndGet() == 1) {
                respond(exchange, """
                    {
                      "output": "Main.java:1: error: invalid code",
                      "statusCode": 200,
                      "compilationStatus": 1,
                      "isExecutionSuccess": false
                    }
                    """);
            } else {
                respond(exchange, """
                    {
                      "output": "JDoodle - Timeout. Please check your program.",
                      "statusCode": 200,
                      "compilationStatus": null,
                      "isExecutionSuccess": false
                    }
                    """);
            }
        });
        server.start();
        JdoodleCodeExecutionClient client = client();
        List<TestCase> tests = List.of(new TestCase(1, "[1]", "1"));

        CodeExecutionResult compilation = client.execute(
            null,
            spec(),
            tests,
            "Java",
            "invalid"
        );
        assertEquals("Compilation failed", compilation.summary());

        CodeExecutionResult timeout = client.execute(
            null,
            spec(),
            tests,
            "Python",
            "while True: pass"
        );
        assertEquals("Execution timed out", timeout.summary());
    }

    @Test
    void reportsSetupRequiredWithoutCredentials() {
        JdoodleProperties properties = new JdoodleProperties();
        JdoodleCodeExecutionClient client = new JdoodleCodeExecutionClient(
            RestClient.builder(),
            properties,
            new CodeHarnessFactory(new ObjectMapper())
        );
        CodeExecutionResult result = client.execute(
            null,
            spec(),
            List.of(new TestCase(1, "[1]", "1")),
            "Python",
            "print(1)"
        );
        assertEquals("JDoodle setup required", result.summary());
    }

    private JdoodleCodeExecutionClient client() {
        JdoodleProperties properties = new JdoodleProperties();
        properties.setBaseUrl(
            "http://127.0.0.1:" + server.getAddress().getPort()
        );
        properties.setClientId("client");
        properties.setClientSecret("secret");
        return new JdoodleCodeExecutionClient(
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
