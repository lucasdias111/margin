package org.margin.server.storage.services;

import org.margin.server.social.api.MarginStorageUsage;
import org.margin.server.storage.repositories.StoredFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarginStorageUsageService implements MarginStorageUsage {

    private final StoredFileRepository storedFileRepository;

    public MarginStorageUsageService(StoredFileRepository storedFileRepository) {
        this.storedFileRepository = storedFileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public long bytesUsedBy(Long marginId) {
        return storedFileRepository.sumSizeBytesByMargin(marginId);
    }
}
