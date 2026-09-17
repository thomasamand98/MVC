-- CreateTable
CREATE TABLE `Conditions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_prestation` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `cmr_fdr` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
