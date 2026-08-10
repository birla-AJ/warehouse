import { useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Stack, Tooltip, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { fontMono, occupancyColor } from '../../theme/theme';
import {
  useCreateZone, useCreateBlock, useCreateRow, useCreateRack, useCreateLevel, useCreatePosition,
} from './warehouses.api';
import { AddNodeDialog } from './AddNodeDialog';

function PositionTile({ position }) {
  const color = occupancyColor[position.status] ?? occupancyColor.DISABLED;
  return (
    <Tooltip
      title={
        <>
          <div>{position.locationCode}</div>
          <div>
            {position.status} · {position.currentLoad}/{position.capacity}
          </div>
        </>
      }
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1,
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fontMono,
          fontSize: 10,
          color: '#fff',
          fontWeight: 700,
          cursor: 'default',
          opacity: 0.92,
        }}
      >
        {position.code}
      </Box>
    </Tooltip>
  );
}

function AddTile({ onClick, label }) {
  return (
    <Tooltip title={label}>
      <Box
        onClick={onClick}
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1,
          border: '1.5px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'text.disabled',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
        }}
      >
        <AddIcon sx={{ fontSize: 16 }} />
      </Box>
    </Tooltip>
  );
}

export function WarehouseMap({ warehouseId, layout }) {
  const [dialog, setDialog] = useState(null); // { kind, parentId }

  const createZone = useCreateZone(warehouseId);
  const createBlock = useCreateBlock(warehouseId);
  const createRow = useCreateRow(warehouseId);
  const createRack = useCreateRack(warehouseId);
  const createLevel = useCreateLevel(warehouseId);
  const createPosition = useCreatePosition(warehouseId);

  const mutations = {
    zone: createZone, block: createBlock, row: createRow, rack: createRack, level: createLevel, position: createPosition,
  };

  const handleSubmit = (values) => {
    const { kind, parentId } = dialog;
    const payload =
      kind === 'block' ? { zoneId: parentId, ...values }
      : kind === 'row' ? { blockId: parentId, ...values }
      : kind === 'rack' ? { rowId: parentId, ...values }
      : kind === 'level' ? { rackId: parentId, ...values }
      : kind === 'position' ? { levelId: parentId, ...values }
      : values; // zone: parentId is warehouseId, already bound in the hook

    mutations[kind].mutate(payload, { onSuccess: () => setDialog(null) });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>
          Warehouse layout
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {Object.entries(occupancyColor).map(([status, color]) => (
            <Stack key={status} direction="row" spacing={0.6} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">
                {status}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Button size="small" startIcon={<AddIcon />} onClick={() => setDialog({ kind: 'zone' })} sx={{ mb: 1.5 }}>
        Add zone
      </Button>

      {(!layout?.zones || layout.zones.length === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No zones yet — add the first zone to start building this warehouse's layout.
        </Typography>
      )}

      {layout?.zones?.map((zone) => (
        <Accordion key={zone.id} defaultExpanded disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Chip label={`Zone ${zone.code}`} size="small" sx={{ fontFamily: fontMono, mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {zone.name}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setDialog({ kind: 'block', parentId: zone.id })}>
              Add block
            </Button>
            {zone.blocks.map((block) => (
              <Box key={block.id} sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Chip label={`Block ${block.code}`} size="small" variant="outlined" sx={{ fontFamily: fontMono }} />
                  <Button size="small" onClick={() => setDialog({ kind: 'row', parentId: block.id })}>
                    + Row
                  </Button>
                </Stack>
                {block.rows.map((row) => (
                  <Box key={row.id} sx={{ mb: 2, pl: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Typography variant="caption" fontFamily={fontMono} color="text.secondary">
                        Row {row.code}
                      </Typography>
                      <Button size="small" onClick={() => setDialog({ kind: 'rack', parentId: row.id })}>
                        + Rack
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                      {row.racks.map((rack) => (
                        <Box key={rack.id} sx={{ minWidth: 160 }}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <Typography variant="caption" fontFamily={fontMono} fontWeight={700}>
                              Rack {rack.code}
                            </Typography>
                            <Button size="small" onClick={() => setDialog({ kind: 'level', parentId: rack.id })}>
                              + Level
                            </Button>
                          </Stack>
                          <Stack spacing={0.5}>
                            {rack.levels.map((level) => (
                              <Stack key={level.id} direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                <Typography variant="caption" color="text.disabled" sx={{ width: 14 }}>
                                  L{level.code}
                                </Typography>
                                {level.positions.map((position) => (
                                  <PositionTile key={position.id} position={position} />
                                ))}
                                <AddTile
                                  label="Add position"
                                  onClick={() => setDialog({ kind: 'position', parentId: level.id })}
                                />
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {dialog && (
        <AddNodeDialog
          open
          title={`Add ${dialog.kind}`}
          withCapacity={dialog.kind === 'position'}
          loading={mutations[dialog.kind].isPending}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}
    </Box>
  );
}
