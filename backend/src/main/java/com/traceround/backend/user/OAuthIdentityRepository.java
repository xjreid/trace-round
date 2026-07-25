package com.traceround.backend.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthIdentityRepository extends JpaRepository<OAuthIdentity, UUID> {
    @EntityGraph(attributePaths = "user")
    Optional<OAuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);
}
