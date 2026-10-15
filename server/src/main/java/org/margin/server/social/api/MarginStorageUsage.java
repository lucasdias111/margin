package org.margin.server.social.api;

/** Bytes of stored files per margin; implemented by the storage module. */
public interface MarginStorageUsage {

    long bytesUsedBy(Long marginId);
}
