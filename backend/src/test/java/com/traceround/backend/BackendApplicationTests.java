package com.traceround.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.traceround.backend.user.AppUser;
import com.traceround.backend.user.AppUserRepository;
import com.traceround.backend.user.OAuthIdentity;
import com.traceround.backend.user.OAuthIdentityRepository;
import com.traceround.backend.problem.ProblemExecutionSpec;
import com.traceround.backend.problem.StarterCodeFactory;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

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

	@Autowired
	private AppUserRepository users;

	@Autowired
	private OAuthIdentityRepository identities;

	@Autowired
	private PlatformTransactionManager transactionManager;

	@Autowired
	private StarterCodeFactory starterCodeFactory;

	@Test
	void contextLoads() {
	}

	@Test
	void existingOAuthIdentityLoadsItsUserBeforeTheTransactionCloses() {
		TransactionTemplate transactions = new TransactionTemplate(transactionManager);
		transactions.executeWithoutResult(status -> {
			AppUser user = users.save(new AppUser(
				"oauth-regression@example.com",
				"OAuth Regression",
				null
			));
			identities.save(new OAuthIdentity(user, "google", "existing-subject"));
		});

		AppUser loadedUser = transactions.execute(status ->
			identities.findByProviderAndProviderSubject("google", "existing-subject")
				.orElseThrow()
				.getUser()
		);

		assertEquals("OAuth Regression", loadedUser.getDisplayName());
		assertEquals("oauth-regression@example.com", loadedUser.getEmail());
	}

	@Test
	void createsEquivalentStarterMethodsForEverySupportedLanguage() {
		ProblemExecutionSpec spec = new ProblemExecutionSpec(
			"twoSum",
			List.of(
				new ProblemExecutionSpec.Parameter("nums", "INTEGER_ARRAY"),
				new ProblemExecutionSpec.Parameter("target", "INTEGER")
			),
			"INTEGER_ARRAY",
			null,
			null,
			null,
			null
		);

		Map<String, String> starters = starterCodeFactory.create(spec);

		assertEquals(4, starters.size());
		assertEquals(true, starters.get("Python").contains("def twoSum"));
		assertEquals(true, starters.get("Java").contains("int[] twoSum"));
		assertEquals(true, starters.get("C++").contains("vector<int> twoSum"));
		assertEquals(true, starters.get("JavaScript").contains("twoSum(nums, target)"));
	}
}
