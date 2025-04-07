'use client';

import { useEffect, useState } from 'react';

import { B2BRole } from './types';
import { useSDK } from './use-b2b-sdk';

export const useB2BQuoteEnabled = () => {
  const [isAddToQuoteEnabled, setIsAddToQuoteEnabled] = useState(false);
  const sdk = useSDK();

  useEffect(() => {
    const quoteConfigs = sdk?.utils?.quote?.getQuoteConfigs();
    const role = sdk?.utils?.user.getProfile().role;

    // eslint-disable-next-line no-restricted-globals
    if (!quoteConfigs || isNaN(Number(role))) {
      return;
    }

    const guestQuoteEnabled =
      quoteConfigs.find(({ key }) => key === 'quote_for_guest')?.value === '1';
    const b2cCustomerQuoteEnabled =
      quoteConfigs.find(({ key }) => key === 'quote_for_individual_customer')?.value === '1';
    const b2bCustomerQuoteEnabled =
      quoteConfigs.find(({ key }) => key === 'quote_for_b2b')?.value === '1';

    if (role === B2BRole.GUEST && guestQuoteEnabled) {
      setIsAddToQuoteEnabled(true);
    }

    if (role === B2BRole.B2C && b2cCustomerQuoteEnabled) {
      setIsAddToQuoteEnabled(true);
    }

    // @ts-expect-error will fix, but for now we need to check if the role is a number
    if (![B2BRole.B2C, B2BRole.GUEST].includes(role) && b2bCustomerQuoteEnabled) {
      setIsAddToQuoteEnabled(true);
    }
  }, [sdk]);

  return isAddToQuoteEnabled;
};
