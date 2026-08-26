import { describe, expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc, serializeAltiumPcbToSvg } from "altiumts"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { CircuitJsonToAltiumConverter } from "../lib"
import { createPcbDocument } from "../lib/create-pcb-document"
import { board, type CircuitElement, expectValidPcb } from "./fixtures"
import { createSideBySideSvg } from "./fixtures/create-side-by-side-svg"

describe("PCB board cutouts repro", () => {
  test("repro: PCB cutouts (pcb_cutout) produce no native Altium board cutout regions", async () => {
    const circuitJson: CircuitElement[] = [
      board({ width: 25, height: 25 }),
      {
        type: "pcb_cutout",
        pcb_cutout_id: "cutout_rect",
        shape: "rect",
        center: { x: -6, y: 5 },
        width: 4,
        height: 3,
      },
      {
        type: "pcb_cutout",
        pcb_cutout_id: "cutout_circle",
        shape: "circle",
        center: { x: 6, y: 5 },
        radius: 1.5,
      },
      {
        type: "pcb_cutout",
        pcb_cutout_id: "cutout_polygon",
        shape: "polygon",
        points: [
          { x: -5, y: -4 },
          { x: -1, y: -4 },
          { x: -3, y: -1 },
        ],
      },
      {
        type: "pcb_cutout",
        pcb_cutout_id: "cutout_path",
        shape: "path",
        route: [
          { x: 2, y: -4 },
          { x: 6, y: -4 },
          { x: 6, y: -1 },
          { x: 2, y: -1 },
        ],
        slot_width: 0.8,
      },
    ]

    const doc = createPcbDocument(circuitJson)
    const cutoutRecords = doc
      .split("\r\n")
      .filter((line) => line.includes("REGIONKIND=BOARDCUTOUT"))

    expect(cutoutRecords).toHaveLength(0)
    expect(doc).not.toContain("REGIONKIND=BOARDCUTOUT")

    const converter = new CircuitJsonToAltiumConverter(circuitJson, {
      projectName: "pcb-cutouts-repro",
    })
    converter.runUntilFinished()
    const pcbOutput = converter.getOutput().pcb
    if (!pcbOutput) throw new Error("Converter did not produce a PCB")

    const altiumPcb = parseAltiumBinaryPcbDoc(pcbOutput.content)
    expect(altiumPcb.regions).toHaveLength(0)
    expectValidPcb(altiumPcb)

    const circuitJsonSvg = await convertCircuitJsonToPcbSvg(
      circuitJson as Parameters<typeof convertCircuitJsonToPcbSvg>[0],
      { showCourtyards: true },
    )
    const altiumSvg = serializeAltiumPcbToSvg(altiumPcb)

    await expect(
      createSideBySideSvg(circuitJsonSvg, altiumSvg),
    ).toMatchSvgSnapshot(import.meta.path, "pcb-cutouts")
  })
})
