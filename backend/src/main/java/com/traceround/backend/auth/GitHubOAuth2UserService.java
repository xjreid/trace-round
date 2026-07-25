package com.traceround.backend.auth;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class GitHubOAuth2UserService
    implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final RestClient github;

    public GitHubOAuth2UserService(RestClient.Builder builder) {
        this.github = builder.baseUrl("https://api.github.com").build();
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User user = delegate.loadUser(request);
        if (
            !"github".equals(request.getClientRegistration().getRegistrationId())
        ) {
            return user;
        }

        GitHubEmail email = loadVerifiedEmail(request);
        Map<String, Object> attributes = new HashMap<>(user.getAttributes());
        attributes.put("email", email.email());
        attributes.put("email_verified", true);

        String nameAttribute = request.getClientRegistration()
            .getProviderDetails()
            .getUserInfoEndpoint()
            .getUserNameAttributeName();
        return new DefaultOAuth2User(
            user.getAuthorities(),
            attributes,
            nameAttribute
        );
    }

    private GitHubEmail loadVerifiedEmail(OAuth2UserRequest request) {
        try {
            GitHubEmail[] emails = github.get()
                .uri("/user/emails")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    "Bearer " + request.getAccessToken().getTokenValue()
                )
                .header(HttpHeaders.USER_AGENT, "TraceRound")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(GitHubEmail[].class);

            if (emails != null) {
                return Arrays.stream(emails)
                    .filter(GitHubEmail::verified)
                    .sorted((left, right) ->
                        Boolean.compare(right.primary(), left.primary())
                    )
                    .findFirst()
                    .orElseThrow(this::emailUnavailable);
            }
        } catch (RestClientException exception) {
            throw new OAuth2AuthenticationException(
                oauthError(),
                "GitHub did not return a verified email address.",
                exception
            );
        }
        throw emailUnavailable();
    }

    private OAuth2AuthenticationException emailUnavailable() {
        return new OAuth2AuthenticationException(
            oauthError(),
            "GitHub did not return a verified email address."
        );
    }

    private OAuth2Error oauthError() {
        return new OAuth2Error(
            "github_email_unavailable",
            "A verified GitHub email address is required.",
            null
        );
    }

    private record GitHubEmail(String email, boolean primary, boolean verified) {
    }
}
