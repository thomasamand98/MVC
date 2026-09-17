-- CreateTable
CREATE TABLE `Marchandises` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `marchandise` VARCHAR(191) NOT NULL,
    `dechet` VARCHAR(191) NOT NULL,
    `code_dechet` VARCHAR(191) NOT NULL,
    `dangereux` BOOLEAN NOT NULL,
    `autorisation` BOOLEAN NOT NULL,
    `interte` BOOLEAN NOT NULL,
    `menage` BOOLEAN NOT NULL,
    `couleur` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
