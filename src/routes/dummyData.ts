import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs } from "@/models/barangs.ts";
import { detailPeminjamans } from "@/models/detailPeminjamans.ts";
import { kendaraans } from "@/models/kendaraans.ts";
import { peminjamans } from "@/models/peminjamans.ts";
import { ruangans } from "@/models/ruangans.ts";
import { tempats } from "@/models/tempat.ts";
import { db } from "@/modules/database.ts";

export const prefix = "/dummyData";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "make a dummy data",
            tags: ["dummyData"],
            response: {
                200: genericResponse(200)
            }
        }
    }, async () => {

        // Tempat
        await db.insert(tempats)
            .values([
                {
                    name: "Gedung IT",
                    category: "gedung",
                    createdAt: new Date()
                },
                {
                    name: "Parkiran",
                    category: "parkiran",
                    createdAt: new Date()
                }
            ])


        // Ruangan
        await db.insert(ruangans)
            .values([
                {
                    code: "R-300",
                    status: false,
                    capacity: 10,
                    category: "kelas",
                    createdAt: new Date(),
                    tempatId: 1
                },
                {
                    code: "R-301",
                    status: true,
                    capacity: 10,
                    category: "kelas",
                    createdAt: new Date(),
                    tempatId: 1
                },
                {
                    code: "R-400",
                    status: false,
                    capacity: 10,
                    category: "gudang",
                    createdAt: new Date(),
                    tempatId: 1
                },
            ])


        // Barang
        await db.insert(barangs)
            .values([
                {
                    name: "Laptop",
                    activaCode: "001",
                    status: false,
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    createdAt: new Date(),
                    ruanganId: 1,
                },
                {
                    name: "Handphone",
                    activaCode: "001",
                    status: false,
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    createdAt: new Date(),
                    ruanganId: 1,
                },
                {
                    name: "Laptop",
                    activaCode: "002",
                    status: false,
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    createdAt: new Date(),
                    ruanganId: 1,
                },
                {
                    name: "Handphone",
                    activaCode: "002",
                    status: false,
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    createdAt: new Date(),
                    ruanganId: 1,
                },
            ])

        // Kendaraan
        await db.insert(kendaraans)
            .values([
                {
                    name: "Honda Toyota",
                    plat: "R 3030 OKO",
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    capacity: 6,
                    category: "mobil",
                    color: "Red",
                    createdAt: new Date(),
                    tax: new Date().toISOString(),
                    tempatId: 2,
                },
                {
                    name: "Ninja",
                    plat: "R 3030 RKT",
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    capacity: 2,
                    category: "motor",
                    color: "Red",
                    createdAt: new Date(),
                    tax: new Date().toISOString(),
                    tempatId: 2,
                },
                {
                    name: "Honda Supra",
                    plat: "R 3030 RRR",
                    condition: "bagus",
                    warranty: new Date().toISOString(),
                    status: true,
                    capacity: 6,
                    category: "mobil",
                    color: "Red",
                    createdAt: new Date(),
                    tax: new Date().toISOString(),
                    tempatId: 2,
                },
            ])

        // Detail Peminjaman
        await db.insert(detailPeminjamans)
            .values([
                {
                    status: "draft",
                    objective: "Meeting",
                    userId: 1,
                    createdAt: new Date()
                },
                {
                    status: "approved",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    objective: "Meeting",
                    destination: "Headquarter",
                    passenger: 20,
                    userId: 1,
                    createdAt: new Date()
                },
                {
                    status: "returned",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    userId: 1,
                    createdAt: new Date()
                },
            ])

        // Peminjaman
        await db.insert(peminjamans)
            .values([
                {
                    category: "barang",
                    userId: 1,
                    barangId: 3,
                    detailPeminjamanId: 1,
                    createdAt: new Date(),
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 4,
                    detailPeminjamanId: 1,
                    createdAt: new Date(),
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 3,
                    detailPeminjamanId: 2,
                    createdAt: new Date(),
                },
                {
                    category: "ruangan",
                    userId: 1,
                    ruanganId: 2,
                    detailPeminjamanId: 3,
                    createdAt: new Date(),
                },
            ])

        return {
            message: "success",
            statusCode: 200
        }
    })
}
