package com.traceround.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
	"GOOGLE_CLIENT_ID=test-google",
	"GOOGLE_CLIENT_SECRET=test-secret",
	"GITHUB_CLIENT_ID=test-github",
	"GITHUB_CLIENT_SECRET=test-secret"
})
@ActiveProfiles({
	"test",
	"oauth-google",
	"oauth-github"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
