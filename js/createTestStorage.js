const defaultConfig = {
    animation: 5,
    list: [
        {
            color:"#f82",
            label:"10",
            img:"https://eucys.eu/wp-content/uploads/2019/09/ribbon_prize-300x300.png",
        },
        {
            color:"#0bf",
            label:"10",
            img : "https://cdn.pixabay.com/photo/2022/08/22/03/07/logo-7402580__340.png"
        },
        {
            color:"#fb0",
            label:"200",
            img:"https://assets.stickpng.com/thumbs/580b57fcd9996e24bc43c521.png",
        },
        {
            color:"#0fb",
            label:"50",
            img:"https://www.pngmart.com/files/12/Shopee-Logo-Transparent-Background.png",
        },
        {
            color:"#b0f",
            label:"100",
            img: 'https://cdn.freebiesupply.com/images/large/2x/dallas-cowboys-logo-transparent.png'
        },
        {
            color:"#f0b",
            label:"5",
            img:"https://cdn-icons-png.flaticon.com/512/1018/1018083.png",
        },
        {
            color:"#bf0",
            label:"500",
            img:"https://assets-global.website-files.com/6152b2d34ca06b6d275dd66e/6152b2d34ca06be4185ddd29_save-money.png",
        },
    ]
};

const isData = localStorage.getItem('boomioPluginWheelOfFortuneConfig')
if (!isData) {
    localStorage.setItem('boomioPluginWheelOfFortuneConfig', JSON.stringify(defaultConfig));
}

