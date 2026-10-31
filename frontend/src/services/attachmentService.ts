import api from './api';
import { ApiResponse, EntryAttachment } from '../types';

export const AttachmentService = {
  /**
   * Upload attachments for an entry
   */
  async upload(entryId: number, files: File[]): Promise<EntryAttachment[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const res = await api.post<ApiResponse<EntryAttachment[]>>(
      `/entries/${entryId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  /**
   * Get attachments for an entry
   */
  async getByEntryId(entryId: number): Promise<EntryAttachment[]> {
    const res = await api.get<ApiResponse<EntryAttachment[]>>(`/entries/${entryId}/attachments`);
    return res.data.data;
  },

  /**
   * Delete an attachment
   */
  async delete(attachmentId: number): Promise<void> {
    await api.delete(`/entries/attachments/${attachmentId}`);
  },

  /**
   * Helper to format attachment URL
   */
  getAttachmentUrl(attachment: EntryAttachment): string {
    if (attachment.url) return attachment.url;
    const filename = attachment.file_path ? attachment.file_path.split(/[/\\]/).pop() : '';
    return `/uploads/${filename}`;
  },
};
