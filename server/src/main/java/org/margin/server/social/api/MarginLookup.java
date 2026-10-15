package org.margin.server.social.api;

public interface MarginLookup {

    MarginSummary summaryOf(Long marginId);

    MarginIcon iconByFileName(String fileName);

    Long ownerUserIdOf(Long marginId);

    java.util.List<Long> adminUserIdsOf(Long marginId);

    java.util.List<MarginSummary> marginsForUser(Long userId);

    /** Whether {@code code} is a margin invite link someone could still join with. */
    boolean isUsableLinkInvite(String code);

    record MarginSummary(Long id, String name, int memberCount) {
    }

    record MarginIcon(Long marginId, String iconUrl) {
    }
}
