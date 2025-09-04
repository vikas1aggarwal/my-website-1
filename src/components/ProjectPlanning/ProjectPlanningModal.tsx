import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Project } from '../../types';

interface ProjectPlanningModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

const ProjectPlanningModal: React.FC<ProjectPlanningModalProps> = ({
  open,
  onClose,
  project,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Project Planning - {project?.name || 'Unknown Project'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" color="textSecondary">
            Project planning functionality will be implemented in a future phase.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            This modal is a placeholder for the project planning feature.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectPlanningModal;
