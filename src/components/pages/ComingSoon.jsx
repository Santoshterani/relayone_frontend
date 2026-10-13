import React from 'react';
import { AppPageHeader, AppSectionCard, AppEmptyState } from '../common';

/** Stand-in for pages that are built in the next sub-phases. */
export default function ComingSoon({ title }) {
  return (<><AppPageHeader title={title} /><AppSectionCard><AppEmptyState title="This page is built in the next phase" message="The API for it is ready." /></AppSectionCard></>);
}
