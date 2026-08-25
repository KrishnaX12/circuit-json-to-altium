import { describe, expect, test } from "bun:test"
import { createSchematicDocument } from "../lib/create-schematic-document"
import { type CircuitElement, sourceComponent, sourcePort } from "./fixtures"

describe("multi-part schematic components", () => {
  test("assigns matching Altium part IDs to component units and their records", () => {
    const circuitJson: CircuitElement[] = [
      sourceComponent("sc_u1", "U1"),
      sourcePort({
        sourcePortId: "sp_u1a_in",
        sourceComponentId: "sc_u1",
        pinNumber: 1,
      }),
      sourcePort({
        sourcePortId: "sp_u1b_in",
        sourceComponentId: "sc_u1",
        pinNumber: 5,
      }),
      {
        type: "schematic_component",
        schematic_component_id: "sch_comp_u1a",
        source_component_id: "sc_u1",
        center: { x: -3, y: 0 },
        size: { width: 2, height: 2 },
        unit_name: "A",
      },
      {
        type: "schematic_port",
        schematic_port_id: "sch_port_u1a_1",
        schematic_component_id: "sch_comp_u1a",
        source_port_id: "sp_u1a_in",
        center: { x: -4, y: 0 },
        facing_direction: "left",
      },
      {
        type: "schematic_component",
        schematic_component_id: "sch_comp_u1b",
        source_component_id: "sc_u1",
        center: { x: 3, y: 0 },
        size: { width: 2, height: 2 },
        unit_name: "B",
      },
      {
        type: "schematic_port",
        schematic_port_id: "sch_port_u1b_5",
        schematic_component_id: "sch_comp_u1b",
        source_port_id: "sp_u1b_in",
        center: { x: 2, y: 0 },
        facing_direction: "left",
      },
    ]

    const records = createSchematicDocument({
      circuitJson,
      includeAllSchematicElements: true,
      schematicSheetId: undefined,
    })
      .split("\r\n")
      .filter(
        (line) =>
          line.startsWith("|RECORD=1|") ||
          line.startsWith("|RECORD=2|") ||
          line.startsWith("|RECORD=14|"),
      )

    expect(records).toEqual([
      expect.stringContaining("CURRENTPARTID=1"),
      expect.stringContaining("OWNERPARTID=1"),
      expect.stringContaining("OWNERPARTID=1"),
      expect.stringContaining("CURRENTPARTID=2"),
      expect.stringContaining("OWNERPARTID=2"),
      expect.stringContaining("OWNERPARTID=2"),
    ])
  })
})
