import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, IconButton, Menu, MenuItem, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { AppPageHeader, AppDataTable, AppConfirmDialog, CustomPagination } from '../../common';
import { useApi, useAppContext, useChannelTypes, useToast } from '../../../hooks';
import { templateService } from '../../../services';
import { dateTime } from '../../../utils/format';

export default function Templates() {
  const { can } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();
  const channelTypes = useChannelTypes();
  const [channel, setChannel] = useState('');
  const { data, loading, error, reload } = useApi(() => templateService.listTemplates(channel), [channel]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [removing, setRemoving] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [busy, setBusy] = useState(false);
  const write = can('templates.write');
  const rows = data || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const remove = async () => {
    setBusy(true);
    try { await templateService.deleteTemplate(removing.id); toast.success('Template deleted.'); setRemoving(null); setPage(1); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const create = <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/templates/new')}>New template</Button>;
  return (
    <>
      <AppPageHeader title="Templates" subtitle="Reusable messages with {placeholders}. Send one by its id: POST /v1/messages with templateId and variables." actions={write && create} />
      <ToggleButtonGroup size="small" exclusive value={channel} onChange={(e, v) => { setChannel(v || ''); setPage(1); }} sx={{ mb: 2 }} aria-label="Channel filter">
        <ToggleButton value="" sx={{ px: 1.75 }}>All</ToggleButton>{channelTypes.types.map((c) => <ToggleButton key={c.code} value={c.code} sx={{ px: 1.75 }}>{c.code === 'email' && <EmailOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />}{c.code === 'inapp' && <NotificationsOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />}{c.label}</ToggleButton>)}
      </ToggleButtonGroup>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      <AppDataTable loading={loading} rows={data ? pageRows : data}
        empty={{ title: 'No templates yet', message: 'A template saves the text and the placeholders you fill in at send time, such as {name} or {code}.', action: write && create }}
        columns={[
          { key: 'id', label: 'Id', width: 70, render: (t) => <span className="mono">{t.id}</span> },
          { key: 'name', label: 'Name', render: (t) => <b>{t.name}</b> },
          { key: 'channel', label: 'Channel', render: (t) => (
            <Chip size="small" variant="outlined" label={channelTypes.labelOf(t.channel)} />
          ) },
          { key: 'subject', label: 'Subject / title', render: (t) => t.subject || '–' },
          { key: 'ph', label: 'Placeholders', render: (t) => (
            t.placeholders.length ? (
              <Accordion disableGutters elevation={0} onClick={(e) => e.stopPropagation()}
                sx={{ bgcolor: 'transparent', '&::before': { display: 'none' }, maxWidth: 300 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 32, px: 0, '&.Mui-expanded': { minHeight: 32 }, '& .MuiAccordionSummary-content': { my: 0.5 }, '& .MuiAccordionSummary-content.Mui-expanded': { my: 0.5 } }}>
                  <Typography variant="body2">{t.placeholders.length} placeholder{t.placeholders.length === 1 ? '' : 's'}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                  <Box sx={{ height: 120, overflowY: 'auto', display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap', gap: 0.5, pr: 0.5 }}>
                    {t.placeholders.map((p) => <Chip key={p.key} size="small" variant="outlined" label={`{${p.key}}`} sx={{ fontFamily: 'monospace' }} />)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ) : '–'
          ) },
          { key: 'updatedAt', label: 'Updated', render: (t) => dateTime(t.updatedAt) },
          { key: 'act', label: 'Actions', width: 90, align: 'right', render: (t) => write && (
            <IconButton size="small" aria-label={`Actions for ${t.name}`} onClick={(e) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, template: t }); }}>
              <MoreVertIcon />
            </IconButton>
          ) }
        ]} />
      {rows.length > 0 && <CustomPagination
        page={currentPage}
        totalPages={totalPages}
        totalCount={rows.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />}
      <Menu anchorEl={actionMenu?.anchorEl} open={!!actionMenu} onClose={() => setActionMenu(null)}>
        <MenuItem onClick={() => { const template = actionMenu.template; setActionMenu(null); navigate(`/templates/${template.id}`); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setRemoving(actionMenu.template); setActionMenu(null); }} sx={{ color: 'error.main' }}>
          <DeleteOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
      <AppConfirmDialog open={!!removing} danger busy={busy} title="Delete this template?" confirmLabel="Delete"
        message={removing ? `"${removing.name}" will be removed. Messages already sent keep their text. API calls using templateId ${removing.id} will fail.` : ''} onConfirm={remove} onClose={() => setRemoving(null)} />
    </>
  );
}
