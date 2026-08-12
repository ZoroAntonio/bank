type Translate = (key: string) => string;

function interpolate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(value),
    template
  );
}

export function getLocalizedTransferError(error: string, t: Translate, language: string) {
  if (language === 'en') return error;

  if (error === 'Not authenticated') {
    return t('dashboardTransfers.errors.notAuthenticated');
  }

  const insufficient = error.match(/^Insufficient ([A-Z0-9]+) balance$/i);
  if (insufficient) {
    return interpolate(t('dashboardTransfers.errors.insufficientBalance'), { asset: insufficient[1] });
  }

  const restricted = error.match(/^([A-Z0-9]+) balance is (pending|frozen) and cannot be used right now\.$/i);
  if (restricted) {
    const statusKey = restricted[2].toLowerCase() === 'pending'
      ? 'dashboardTransfers.errors.pending'
      : 'dashboardTransfers.errors.frozen';
    return interpolate(t('dashboardTransfers.errors.restrictedBalance'), {
      asset: restricted[1],
      status: t(statusKey),
    });
  }

  return t('dashboardTransfers.errors.generic');
}
