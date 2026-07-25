package com.traceround.backend.user;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
    name = "oauth_identities",
    uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_subject"})
)
public class OAuthIdentity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    private String provider;

    @jakarta.persistence.Column(name = "provider_subject")
    private String providerSubject;

    protected OAuthIdentity() {
    }

    public OAuthIdentity(AppUser user, String provider, String providerSubject) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.provider = provider;
        this.providerSubject = providerSubject;
    }

    public AppUser getUser() {
        return user;
    }
}
