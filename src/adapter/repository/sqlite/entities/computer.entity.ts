import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "computers" })
export class ComputerEntity {
  @PrimaryKey()
  id!: string;               // DeviceId

  @Property()
  brand!: string;            // DeviceBrand

  @Property()
  model!: string;            // DeviceModel

  @Property({ nullable: true })
  color?: string;            // DeviceColor?

  @Property()
  photoURL!: string;         // guardamos URL como string

  @Property()
  ownerId!: string;          // DeviceOwner.id

  @Property()
  ownerName!: string;        // DeviceOwner.name

  @Property({ nullable: true })
  checkinAt?: Date;

  @Property({ nullable: true })
  checkoutAt?: Date;

  @Property()
  updatedAt!: Date;
}
