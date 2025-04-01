import { unstable_rethrow as rethrow } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { getSessionCustomerAccessToken } from '~/auth';
import { getChannelIdFromLocale } from '~/channels.config';
import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { redirect } from '~/i18n/routing';
import { getCartId } from '~/lib/cart';

const CheckoutRedirectMutation = graphql(`
  mutation CheckoutRedirectMutation($cartId: String!) {
    cart {
      createCartRedirectUrls(input: { cartEntityId: $cartId }) {
        errors {
          ... on NotFoundError {
            __typename
          }
        }
        redirectUrls {
          redirectedCheckoutUrl
        }
      }
    }
  }
`);

export async function GET(_: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cartId = await getCartId();
  const customerAccessToken = await getSessionCustomerAccessToken();
  const channelId = getChannelIdFromLocale(locale);

  if (!cartId) {
    return NextResponse.json(
      { message: 'Cart not found' },
      { status: 404, statusText: 'Not Found' },
    );
  }

  try {
    const { data } = await client.fetch({
      document: CheckoutRedirectMutation,
      variables: { cartId },
      fetchOptions: { cache: 'no-store' },
      customerAccessToken,
      channelId,
    });

    if (
      data.cart.createCartRedirectUrls.errors.length > 0 ||
      !data.cart.createCartRedirectUrls.redirectUrls
    ) {
      return NextResponse.json(
        { message: 'Cart not found' },
        { status: 404, statusText: 'Not Found' },
      );
    }

    return redirect({
      href: data.cart.createCartRedirectUrls.redirectUrls.redirectedCheckoutUrl,
      locale,
    });
  } catch (error) {
    rethrow(error);

    // eslint-disable-next-line no-console
    console.error(error);

    return NextResponse.json(
      { message: 'Server error' },
      { status: 500, statusText: 'Server error' },
    );
  }
}
