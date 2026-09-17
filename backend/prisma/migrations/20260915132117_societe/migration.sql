-- CreateTable
CREATE TABLE `Societe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `denomination` VARCHAR(191) NOT NULL,
    `numero_tva` VARCHAR(191) NOT NULL,
    `activite` VARCHAR(191) NOT NULL,
    `site_web` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
