import React, { useState, useEffect } from 'react';
import { Box, MenuItem, Select, Typography } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import { PAGE_SIZES } from '../../config';

const BTN_BASE = {
    height: 32,
    minWidth: 32,
    px: '10px',
    borderRadius: '6px',
    border: '1px solid #c7c3c3ff',
    bgcolor: '#ffffffff',
    color: '#111827',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
        transition: 'all 0.15s',
    '&:hover': { bgcolor: '#F9FAFB' },
    '&:active': { transform: 'translateY(1px)' },
    '&:disabled': { color: '#717680ff', cursor: 'not-allowed', bgcolor: '#F9FAFB', borderColor: '#d4d4d4ff' },
};

const BTN_ICON = {
    ...BTN_BASE,
    px: '8px',
    minWidth: 32,
    '& svg': { color: '#111827' },
    '&:disabled svg': { color: '#6B7280' },
};

/**
 * Custom pagination bar matching the reference design.
 * Props: page, totalPages, totalCount, pageSize, onPageChange, onPageSizeChange
 * pageSizeOptions (optional): array of numbers for the "items per page" dropdown.
 */
const CustomPagination = ({
    page,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = PAGE_SIZES,
}) => {

    const [showTotalCount, setShowTotalCount] = useState(false);
    const [goToInput, setGoToInput] = useState(String(page || 1));

    // Calculate totalPages from totalCount if not provided
    const calculatedTotalPages = totalCount ? Math.ceil(totalCount / pageSize) || 1 : (totalPages || 1);
    const safeTotalPages = calculatedTotalPages;

    useEffect(() => {
        setGoToInput(String(page || 1));
    }, [page]);

    const goToPage = (nextPage) => {
        const clamped = Math.min(Math.max(nextPage, 1), safeTotalPages);
        onPageChange(clamped);
    };

    const submitGoTo = () => {
        const next = Number(goToInput);
        if (!Number.isFinite(next)) return;
        goToPage(next);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: '10px',
                borderTop: '1px solid #E5E7EB',
                bgcolor: '#F9FAFB',
                flexWrap: 'wrap',
                gap: 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    Items per page:
                </Typography>
                <Select
                    value={pageSize}
                    onChange={(e) => {
                        onPageSizeChange(Number(e.target.value));
                    }}
                    size="small"
                    sx={{
                        height: 32,
                        fontSize: 13,
                        borderRadius: '6px',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                        bgcolor: '#fff',
                    }}
                >
                    {pageSizeOptions.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
                            {s}
                        </MenuItem>
                    ))}
                </Select>

                {typeof totalCount === 'number' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, WebkitTextSizeAdjust: '100%' }}>
                        <Typography component="span" sx={{ fontSize: 13, lineHeight: '16px', color: '#96999eff' }}>
                            |
                        </Typography>

                        {showTotalCount ? (
                            <Box
                                component="button"
                                type="button"
                                onClick={() => setShowTotalCount(false)}
                                sx={{
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography component="span" sx={{ fontSize: 13, lineHeight: '16px', color: '#111827', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {totalCount}
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                component="button"
                                type="button"
                                onClick={() => setShowTotalCount(true)}
                                sx={{
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography component="span" sx={{ fontSize: 13, lineHeight: '16px', color: '#0F3278', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    View Total Count
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box
                    component="button"
                    onClick={() => goToPage(1)}
                    disabled={page === 1}
                    sx={BTN_ICON}
                    title="First page"
                >
                    <FirstPageIcon sx={{ fontSize: 18 }} />
                </Box>

                <Box
                    component="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    sx={BTN_ICON}
                    title="Previous page"
                >
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </Box>

                <Box
                    sx={{
                        height: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        bgcolor: '#fff',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        component="input"
                        value={goToInput}
                        onChange={(e) => setGoToInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitGoTo();
                        }}
                        inputMode="numeric"
                        type="number"
                        min={1}
                        max={safeTotalPages}
                        sx={{
                            width: 56,
                            height: 32,
                            border: 'none',
                            outline: 'none',
                            textAlign: 'center',
                            px: '10px',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#111827',
                            backgroundColor: 'transparent',
                                                        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                opacity: 1,
                            },
                        }}
                    />

                    <Box
                        component="button"
                        type="button"
                        onClick={submitGoTo}
                        sx={{
                            all: 'unset',
                            cursor: 'pointer',
                            width: 36,
                            height: 32,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderLeft: '1px solid #E5E7EB',
                            '&:hover': { bgcolor: '#F9FAFB' },
                        }}
                        title="Go to page"
                    >
                        <SearchIcon sx={{ fontSize: 18, color: '#111827' }} />
                    </Box>
                </Box>

                <Box
                    component="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === safeTotalPages || safeTotalPages === 0}
                    sx={BTN_ICON}
                    title="Next page"
                >
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                </Box>

                <Box
                    component="button"
                    onClick={() => goToPage(safeTotalPages)}
                    disabled={page === safeTotalPages}
                    sx={BTN_ICON}
                    title="Last page"
                >
                    <LastPageIcon sx={{ fontSize: 18 }} />
                </Box>

                <Typography sx={{ fontSize: 13, color: '#6B7280', ml: 0.5, whiteSpace: 'nowrap' }}>
                    Page {page} of {safeTotalPages}
                </Typography>
            </Box>
        </Box>
    );
};

export default CustomPagination;
