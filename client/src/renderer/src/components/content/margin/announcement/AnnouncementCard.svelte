<script lang="ts">
  import type { Announcement } from '$src/interfaces/Announcement'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'

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
            <Icon name="edit" size={12} strokeWidth={2.5} />
          </button>
          <button
            class="action-btn delete-btn"
            aria-label="Delete announcement"
            onclick={() => onDelete(announcement.announcementId)}
          >
            <Icon name="trash" size={12} strokeWidth={2.5} />
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
