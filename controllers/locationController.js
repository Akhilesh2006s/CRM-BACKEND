// @desc    Get town name from pincode
// @route   GET /api/location/get-town
// @access  Public
const getTownFromPincode = async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({ message: 'Valid 6-digit pincode is required' });
    }

    // Using India Post API or similar service
    // For now, using a simple mock/fallback approach
    // In production, integrate with actual pincode API like:
    // - https://api.postalpincode.in/pincode/{pincode}
    // - Or use a local database lookup

    try {
      // Using node-fetch or axios for server-side
      const https = require('https');
      const url = `https://api.postalpincode.in/pincode/${pincode}`;
      
      const data = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffices = data[0].PostOffice;
        const firstPostOffice = postOffices[0];
        return res.json({
          pincode,
          town: firstPostOffice.Name,
          district: firstPostOffice.District,
          state: firstPostOffice.State,
          region: firstPostOffice.Division || firstPostOffice.Region || firstPostOffice.District,
          postOffices: postOffices.map(po => ({
            Name: po.Name,
            District: po.District,
            State: po.State,
            Division: po.Division,
            Region: po.Region,
            Block: po.Block,
            BranchType: po.BranchType,
          })),
          success: true,
        });
      } else {
        return res.status(404).json({ message: 'Pincode not found', success: false });
      }
    } catch (fetchError) {
      // Fallback: return a generic response
      console.error('Pincode API error:', fetchError);
      return res.json({
        pincode,
        town: 'Town Name', // Placeholder - should be replaced with actual API
        success: false,
        message: 'Pincode lookup service unavailable. Please enter town manually.',
      });
    }
  } catch (error) {
    console.error('Error getting town from pincode:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTownFromPincode,
};

