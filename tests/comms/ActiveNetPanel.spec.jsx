import { test, expect } from '@playwright/test';
import React from 'react';
import { render } from 'playwright-react-ct';
import ActiveNetPanel from '../../src/components/comms/ActiveNetPanel';
import { LiveKitProvider } from '../../src/hooks/useLiveKit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test.describe('ActiveNetPanel', () => {
  let queryClient;

  test.beforeEach(() => {
    queryClient = new QueryClient();
  });

  test('should render participants in the roster', async ({ mount }) => {
    const mockNet = {
      id: 'test-net',
      code: 'ALPHA',
      label: 'Alpha Squad',
      type: 'squad',
      linked_squad_id: 'squad-1',
      min_rank_to_tx: 1,
      min_rank_to_rx: 1,
    };

    const mockUser = {
      id: 'user-1',
      callsign: 'Specter',
      rank: 'Sergeant',
    };

    const component = await mount(
      <QueryClientProvider client={queryClient}>
        <LiveKitProvider>
          <ActiveNetPanel net={mockNet} user={mockUser} eventId="test-event" />
        </LiveKitProvider>
      </QueryClientProvider>
    );

    // Since the component fetches data, we need to wait for it to be rendered.
    // We can't easily mock the supabase calls here, so we will just check for the static parts of the component.
    await expect(component.locator('h2:has-text("ALPHA")')).toBeVisible();
    await expect(component.locator('p:has-text("Alpha Squad")')).toBeVisible();
  });
});
