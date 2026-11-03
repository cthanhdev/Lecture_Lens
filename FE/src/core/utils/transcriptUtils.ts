import { TranscriptSegment } from '../../shared/models/lecture.types';

export const filterTranscripts = (
  transcripts: TranscriptSegment[] | undefined | null,
  search: string
): TranscriptSegment[] => {
  if (!transcripts || !Array.isArray(transcripts)) return [];
  const q = (search || '').trim().toLowerCase();
  if (!q) return transcripts;
  return transcripts.filter((seg) => {
    const content = (seg.content || '').toLowerCase();
    const speaker = (seg.speaker || '').toLowerCase();
    return content.includes(q) || speaker.includes(q);
  });
};
