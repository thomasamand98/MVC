/*
  Warnings:

  - You are about to drop the `point` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `point`;

-- CreateTable
CREATE TABLE `Points` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `nom_societe` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NOT NULL,
    `adresse_rue` VARCHAR(191) NOT NULL,
    `code_postal` VARCHAR(191) NOT NULL,
    `localite` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
