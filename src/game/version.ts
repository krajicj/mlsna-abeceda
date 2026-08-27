/** Version of the localStorage save format. Bump on every breaking change (with a migration). */
export const SAVE_VERSION = 2 as const;
/**
 * localStorage key of the save record. The key is the slot; the version lives in the record's
 * `version` field. Renaming the key on every bump would mean reading several keys at every start
 * and leaving one dead record behind in storage for each bump.
 */
export const SAVE_KEY = 'kk.save.v1' as const;
/**
 * Where the raw text of a record the game cannot read is put aside – a foreign format, a record
 * from a newer build or plain rubbish. One backup, holding the latest such text: the point is
 * "the game did not understand a record once and a parent wants it back" (rule 4), not an archive.
 */
export const SAVE_BACKUP_KEY = 'kk.save.backup' as const;
