import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import logger from '../utils/logger';

/** Wrap a section so a crash there shows a message instead of a blank screen. */
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { logger.error(`crash in ${this.props.name || 'section'}`, error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>Something went wrong here</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>The rest of the app still works.</Typography>
        <Button variant="outlined" onClick={() => this.setState({ failed: false })}>Try again</Button>
      </Box>
    );
  }
}
