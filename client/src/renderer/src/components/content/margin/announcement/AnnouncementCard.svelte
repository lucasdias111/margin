<script lang="ts">
  import type { Announcement } from '$src/interfaces/Announcement'
  import { formatTimestamp } from '$src/utils/DateUtils'

  interface Props {
    announcement: Announcement
    canManage: boolean
    onEdit: (announcement: Announcement) => void
    onDelete: (announcementId: number) => void
  }

  let { announcement, canManage, onEdit, onDelete }: Props = $props()
</script>

<div class="announcement-item">
  <div class="announcement-header">
    <span class="announcement-title">{announcement.title}</span>
    <div class="announcement-header-right">
      <span class="announcement-date">{formatTimestamp(announcement.createdAt)}</span>
      {#if canManage}
        <div class="announcement-actions">
          <button
            class="action-btn edit-btn"
            aria-label="Edit announcement"
            onclick={() => onEdit(announcement)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            class="action-btn delete-btn"
            aria-label="Delete announcement"
            onclick={() => onDelete(announcement.announcementId)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
  <div class="announcement-content">
    <span>{announcement.content}</span>
  </div>
  <div class="announcement-footer">
    <span class="announcement-author">Posted by {announcement.author.displayName}</span>
  </div>
</div>

<style>
  .announcement-item {
    background: white;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid #f47e3a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.15s;
  }

  .announcement-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .announcement-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .announcement-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
  }

  .announcement-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .announcement-date {
    font-size: 11px;
    color: #c0c0c0;
    white-space: nowrap;
    margin-top: 2px;
  }

  .announcement-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .announcement-item:hover .announcement-actions {
    opacity: 1;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s;
  }

  .edit-btn {
    background: #f0f0f0;
    color: #888;
  }
  .edit-btn:hover {
    background: #e8e8e8;
    color: #444;
  }

  .delete-btn {
    background: #fff0f0;
    color: #e57373;
  }
  .delete-btn:hover {
    background: #ffe0e0;
    color: #c62828;
  }

  .announcement-content {
    font-size: 13px;
    color: #555;
    line-height: 1.65;
  }

  .announcement-footer {
    display: flex;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #f2f2f2;
  }

  .announcement-author {
    font-size: 11px;
    font-weight: 600;
    color: #c0c0c0;
    letter-spacing: 0.02em;
  }
</style>
