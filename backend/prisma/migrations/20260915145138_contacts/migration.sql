-- CreateTable
CREATE TABLE `Contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `societe` VARCHAR(191) NOT NULL,
    `fonction` VARCHAR(191) NOT NULL,
    `service_bureau` VARCHAR(191) NOT NULL,
    `portable` VARCHAR(191) NOT NULL,
    `fixe` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `civilite` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
