import { describe, expect, test } from "bun:test"
import { parseAltiumSchDoc, serializeAltiumSheetToSvg } from "altiumts"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { CircuitJsonToAltiumConverter } from "../lib"
import { createSchematicDocument } from "../lib/create-schematic-document"
import { type CircuitElement, sourceComponent, sourcePort } from "./fixtures"
import { createSideBySideSvg } from "./fixtures/create-side-by-side-svg"

describe("schematic pin flags", () => {
  test("exports clock and inverted pin symbols to native Altium fields", async () => {
    const circuitJson: CircuitElement[] = [
      sourceComponent("sc1", "U1"),
      sourcePort({
        sourcePortId: "sp_clk",
        sourceComponentId: "sc1",
        pinNumber: 1,
      }),
      sourcePort({
        sourcePortId: "sp_rst_n",
        sourceComponentId: "sc1",
        pinNumber: 2,
      }),
      {
        type: "schematic_component",
        schematic_component_id: "sch_u1",
        source_component_id: "sc1",
        center: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      },
      {
        type: "schematic_port",
        schematic_port_id: "port_clk",
        schematic_component_id: "sch_u1",
        source_port_id: "sp_clk",
        center: { x: -1.2, y: 0.5 },
        facing_direction: "left",
        side_of_component: "left",
        distance_from_component_edge: 0.2,
        display_pin_label: "CLK",
        has_input_arrow: true,
      },
      {
        type: "schematic_port",
        schematic_port_id: "port_rst_n",
        schematic_component_id: "sch_u1",
        source_port_id: "sp_rst_n",
        center: { x: -1.2, y: -0.5 },
        facing_direction: "left",
        side_of_component: "left",
        distance_from_component_edge: 0.2,
        display_pin_label: "~RESET",
        is_drawn_with_inversion_circle: true,
      },
    ]

    const pinRecords = createSchematicDocument({
      circuitJson,
      includeAllSchematicElements: true,
      schematicSheetId: undefined,
    })
      .split("\r\n")
      .filter((line) => line.startsWith("|RECORD=2|"))

    expect(pinRecords).toHaveLength(2)
    expect(pinRecords[0]).toContain("SYMBOL_INNEREDGE=3")
    expect(pinRecords[0]).not.toContain("SYMBOL_OUTEREDGE")
    expect(pinRecords[1]).toContain("SYMBOL_OUTEREDGE=1")
    expect(pinRecords[1]).not.toContain("SYMBOL_INNEREDGE")

    const converter = new CircuitJsonToAltiumConverter(circuitJson, {
      projectName: "schematic-pin-flags",
    })
    converter.runUntilFinished()
    const firstSchematic = converter.getOutput().schematics[0]
    if (!firstSchematic) throw new Error("Converter did not create a schematic")

    const circuitJsonSvg = await convertCircuitJsonToSchematicSvg(
      circuitJson as Parameters<typeof convertCircuitJsonToSchematicSvg>[0],
    )
    const altiumSvg = serializeAltiumSheetToSvg(
      parseAltiumSchDoc(firstSchematic.content),
    )
    await expect(
      createSideBySideSvg(circuitJsonSvg, altiumSvg),
    ).toMatchSvgSnapshot(import.meta.path, "clock-and-inverted-pin-flags")
  })
})
