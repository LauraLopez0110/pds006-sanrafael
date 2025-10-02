import { Migration } from '@mikro-orm/migrations';

export class Migration20251002041745 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`computers\` (\`id\` text not null, \`brand\` text not null, \`model\` text not null, \`color\` text null, \`photo_url\` text not null, \`owner_id\` text not null, \`owner_name\` text not null, \`checkin_at\` datetime null, \`checkout_at\` datetime null, \`updated_at\` datetime not null, primary key (\`id\`));`);

    this.addSql(`create table \`frequent_computers\` (\`id\` text not null, \`brand\` text not null, \`model\` text not null, \`owner_id\` text not null, \`owner_name\` text not null, \`photo_url\` text not null, \`created_at\` datetime not null, \`last_checkin_at\` datetime null, \`last_checkout_at\` datetime null, \`updated_at\` datetime not null, primary key (\`id\`));`);

    this.addSql(`create table \`medical_devices\` (\`id\` text not null, \`brand\` text not null, \`model\` text not null, \`photo_url\` text not null, \`owner_id\` text not null, \`owner_name\` text not null, \`checkin_at\` datetime null, \`checkout_at\` datetime null, \`serial\` text not null, \`updated_at\` datetime not null, primary key (\`id\`));`);
    this.addSql(`create unique index \`medical_devices_serial_unique\` on \`medical_devices\` (\`serial\`);`);
  }

}
