import { IsNotEmpty } from 'class-validator';

export class UpsertSettingDto {
  @IsNotEmpty()
  value: unknown; // arbitrary JSON — shape is defined by convention per key (see SettingsService.WELL_KNOWN_KEYS)
}
