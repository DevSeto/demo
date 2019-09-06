class Helper {

    getSubdomain(domain)
    {
        console.log(domain)
        let splitedData;

        if( domain )
        {
            splitedData = domain.split(".");

            if ( splitedData.length >= 2 )
            {
                splitedData = splitedData[0].split("//");

                return splitedData[1];
            }
        }

        return !1;
    }
}

module.exports = new Helper();