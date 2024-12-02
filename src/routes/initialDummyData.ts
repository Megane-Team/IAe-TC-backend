import { genericResponse } from "@/constants.ts";
import { server } from "@/index.ts";
import { barangs } from "@/models/barangs.ts";
import { detailPeminjamans } from "@/models/detailPeminjamans.ts";
import { kendaraans } from "@/models/kendaraans.ts";
import { peminjamans } from "@/models/peminjamans.ts";
import { ruangans } from "@/models/ruangans.ts";
import { tempats, tempatSchema } from "@/models/tempat.ts";
import { db } from "@/modules/database.ts";

export const prefix = "/initialDummyData";
export const route = (instance: typeof server) => { instance
    .get("/", {
        schema: {
            description: "Insert initial dummy data",
            tags: ["initialDummyData"],
            response: {
                200: genericResponse(200),
                401: genericResponse(401)
            }
        }
    }, async () => {
        await db
            .insert(tempats)
            .values([
                {
                    name: "Gedung IT",
                    category: "gedung",
                    photo: "Gudang IT",
                    createdAt: new Date()
                },
                {
                    name: "Gedung DIklat",
                    category: "gedung",
                    photo: "Gedung Diklat",
                    createdAt: new Date

                },
                {
                    name: "Parkiran IT",
                    category: "parkiran",
                    photo: "Parkiran IT",
                    createdAt: new Date
                }
            ])

        await db
            .insert(ruangans)
            .values([
                {
                    code: "R-001",
                    status: "TDG",
                    capacity: 100,
                    category: "kelas",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 1
                },
                {
                    code: "R-002",
                    status: "TDG",
                    capacity: 100,
                    category: "lab",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 1
                },
                {
                    code: "R-003",
                    status: "TDG",
                    category: "gudang",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 1
                },
                {
                    code: "R-004",
                    status: "TDG",
                    capacity: 100,
                    category: "kelas",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 2
                },
                {
                    code: "R-005",
                    status: "TDG",
                    capacity: 100,
                    category: "lab",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 2
                },
                {
                    code: "R-006",
                    status: "TDG",
                    category: "gudang",
                    photo: "Ruang IT",
                    createdAt: new Date(),
                    tempatId: 2
                }
            ])

        await db 
            .insert(barangs)
            .values([
                {
                    name: "Laptop",
                    code: "001",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 1
                },
                {
                    name: "Proyektor",
                    code: "001",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 1
                },
                {
                    name: "Laptop",
                    code: "002",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 2
                },
                {
                    name: "Proyektor",
                    code: "002",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 2
                },
                {
                    name: "Laptop",
                    code: "003",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 3
                },
                {
                    name: "Proyektor",
                    code: "003",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 3
                },
                {
                    name: "Laptop",
                    code: "004",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 4
                },
                {
                    name: "Proyektor",
                    code: "004",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 4
                },
                {
                    name: "Laptop",
                    code: "005",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 5
                },
                {
                    name: "Proyektor",
                    code: "005",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 5
                },
                {
                    name: "Laptop",
                    code: "006",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Laptop",
                    createdAt: new Date(),
                    ruanganId: 6
                },
                {
                    name: "Proyektor",
                    code: "006",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    photo: "Proyektor",
                    createdAt: new Date(),
                    ruanganId: 6
                }
            ])

        await db
            .insert(kendaraans)
            .values([
                {
                    name: "Mobil",
                    plat: "Z 1298 MNS",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    capacity: 5,
                    category: "mobil",
                    color: "Hitam",
                    photo: "Mobil",
                    createdAt: new Date(),
                    tempatId: 3
                },
                {
                    name: "Motor",
                    plat: "B 9009 KLS",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    capacity: 2,
                    category: "motor",
                    color: "Hitam",
                    photo: "Motor",
                    createdAt: new Date(),
                    tempatId: 3
                },
                {
                    name: "Truk",
                    plat: "T 1234 KLS",
                    status: "TDG",
                    condition: "Baik",
                    warranty: new Date().toISOString(),
                    capacity: 10,
                    category: "truk",
                    color: "Hitam",
                    photo: "Truk",
                    createdAt: new Date(),
                    tempatId: 3
                }
            ])

        await db
            .insert(detailPeminjamans)
            .values([
                {
                    status: "draft",
                    borrowedDate: null,
                    estimatedTime: null,
                    returnDate: null,
                    objective: "Meeting",
                    destination: "Kantor",
                },
                {
                    status: "pending",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    destination: "Kantor",
                },
                {
                    status: "approved",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    destination: "Kantor",
                },
                {
                    status: "rejected",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    destination: "Kantor",
                },
                {
                    status: "returned",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    destination: "Kantor",
                },
                {
                    status: "canceled",
                    borrowedDate: new Date(),
                    estimatedTime: new Date(),
                    returnDate: new Date(),
                    objective: "Meeting",
                    destination: "Kantor",  
                }
            ])

        await db
            .insert(peminjamans)
            .values([
                {
                    category: "barang",
                    userId: 1,
                    barangId: 1,
                    detailPeminjamanId: 1,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 2,
                    detailPeminjamanId: 1,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 1,
                    detailPeminjamanId: 1,
                    createdAt: new Date()
                },
                
                {
                    category: "barang",
                    userId: 1,
                    barangId: 3,
                    detailPeminjamanId: 2,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 4,
                    detailPeminjamanId: 2,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 2,
                    detailPeminjamanId: 2,
                    createdAt: new Date()
                },

                {
                    category: "barang",
                    userId: 1,
                    barangId: 5,
                    detailPeminjamanId: 3,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 6,
                    detailPeminjamanId: 3,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 3,
                    detailPeminjamanId: 3,
                    createdAt: new Date()
                },

                {
                    category: "barang",
                    userId: 1,
                    barangId: 7,
                    detailPeminjamanId: 4,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 8,
                    detailPeminjamanId: 4,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 1,
                    detailPeminjamanId: 4,
                    createdAt: new Date()
                },

                {
                    category: "barang",
                    userId: 1,
                    barangId: 9,
                    detailPeminjamanId: 5,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 10,
                    detailPeminjamanId: 5,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 2,
                    detailPeminjamanId: 5,
                    createdAt: new Date()
                },

                {
                    category: "barang",
                    userId: 1,
                    barangId: 11,
                    detailPeminjamanId: 6,
                    createdAt: new Date()
                },
                {
                    category: "barang",
                    userId: 1,
                    barangId: 12,
                    detailPeminjamanId: 6,
                    createdAt: new Date()
                },
                {
                    category: "kendaraan",
                    userId: 1,
                    kendaraanId: 3,
                    detailPeminjamanId: 6,
                    createdAt: new Date()
                },
            ])

        return {
            statusCode: 200,
            message: "Success"
        };
    })
} 
