export function ipAddressValidator(ipAddress) {
  const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (!ipAddress) return "IpAddress can't be empty.";
  if (ipAddress.length < 5)
    return 'IpAddress must be at longer than  5 characters.';

  if (!ipAddressRegex.test(ipAddress))
    return 'Ooops! We need a valid Ipaddress.';

  return '';
}
