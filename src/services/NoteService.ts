import { BaseService } from './BaseService';
import { Note } from '../entities/Note';
import { CreateNoteDto } from '../dtos/CreateNoteDto';
import { UpdateNoteDto } from '../dtos/UpdateNoteDto';

export class NoteService extends BaseService<Note, CreateNoteDto, UpdateNoteDto> {
  constructor() {
    super(Note, CreateNoteDto, UpdateNoteDto, ['title', 'content']);
  }

  async getNotesByEntity(entityType: string, entityId: string): Promise<Note[]> {
    return await this.repository.find({
      where: {
        relatedEntity: entityType,
        relatedEntityId: entityId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveNotes(): Promise<Note[]> {
    return await this.repository.find({
      where: { status: 'Active' },
      order: { createdAt: 'DESC' },
    });
  }

  async getArchivedNotes(): Promise<Note[]> {
    return await this.repository.find({
      where: { status: 'Archived' },
      order: { createdAt: 'DESC' },
    });
  }

  async archiveNote(id: string): Promise<Note> {
    await this.repository.update(id, { status: 'Archived' } as any);
    return await this.findById(id) as Note;
  }

  async unarchiveNote(id: string): Promise<Note> {
    await this.repository.update(id, { status: 'Active' } as any);
    return await this.findById(id) as Note;
  }

  async searchNotes(query: string): Promise<Note[]> {
    return await this.repository
      .createQueryBuilder('note')
      .where('note.title ILIKE :query OR note.content ILIKE :query', { query: `%${query}%` })
      .orderBy('note.createdAt', 'DESC')
      .getMany();
  }
}